import { createServiceRoleClient } from "./service-role";
import { getProjectId } from "./project";
import { CreemCustomer, CreemSubscription } from "@/types/creem";

export async function createOrUpdateCustomer(
  creemCustomer: CreemCustomer,
  userId: string
) {
  const supabase = createServiceRoleClient();
  const projectId = await getProjectId(supabase);
  const { data: authUserResult } = await supabase.auth.admin.getUserById(userId);
  const canonicalEmail = authUserResult?.user?.email ?? creemCustomer.email ?? null;

  // First, try to find existing customer by user_id (preserves existing credits from registration)
  const { data: existingByUserId, error: userIdError } = await supabase
    .from("customers")
    .select()
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  if (userIdError && userIdError.code !== "PGRST116") {
    throw userIdError;
  }

  // If found by user_id, update with Creem customer info
  if (existingByUserId) {
    const { error } = await supabase
      .from("customers")
      .update({
        creem_customer_id: creemCustomer.id,
        email: existingByUserId.email || canonicalEmail,
        name: existingByUserId.name || creemCustomer.name,
        country: creemCustomer.country,
        updated_at: new Date().toISOString(),
      })
      .eq("project_id", projectId)
      .eq("id", existingByUserId.id);

    if (error) throw error;
    console.log(`Updated existing customer ${existingByUserId.id} with Creem info`);
    return existingByUserId.id;
  }

  // Fallback: try to find by creem_customer_id
  const { data: existingByCreemId, error: creemIdError } = await supabase
    .from("customers")
    .select()
    .eq("project_id", projectId)
    .eq("creem_customer_id", creemCustomer.id)
    .single();

  if (creemIdError && creemIdError.code !== "PGRST116") {
    throw creemIdError;
  }

  if (existingByCreemId) {
    const { error } = await supabase
      .from("customers")
      .update({
        email: existingByCreemId.email || canonicalEmail,
        name: existingByCreemId.name || creemCustomer.name,
        country: creemCustomer.country,
        updated_at: new Date().toISOString(),
      })
      .eq("project_id", projectId)
      .eq("id", existingByCreemId.id);

    if (error) throw error;
    return existingByCreemId.id;
  }

  // Create new customer if not found
  const { data: newCustomer, error } = await supabase
    .from("customers")
    .insert({
      project_id: projectId,
      user_id: userId,
      creem_customer_id: creemCustomer.id,
      email: canonicalEmail,
      name: creemCustomer.name,
      country: creemCustomer.country,
      credits: 0, // New customers start with 0, credits will be added separately
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  console.log(`Created new customer ${newCustomer.id}`);
  return newCustomer.id;
}


export async function createOrUpdateSubscription(
  creemSubscription: CreemSubscription,
  customerId: string
) {
  const supabase = createServiceRoleClient();
  const projectId = await getProjectId(supabase);

  const { data: existingSubscription, error: fetchError } = await supabase
    .from("subscriptions")
    .select()
    .eq("project_id", projectId)
    .eq("creem_subscription_id", creemSubscription.id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw fetchError;
  }

  const subscriptionData = {
    project_id: projectId,
    customer_id: customerId,
    creem_product_id:
      typeof creemSubscription?.product === "string"
        ? creemSubscription?.product
        : creemSubscription?.product?.id,
    status: creemSubscription?.status,
    current_period_start: creemSubscription?.current_period_start_date,
    current_period_end: creemSubscription?.current_period_end_date,
    canceled_at: creemSubscription?.canceled_at,
    metadata: creemSubscription?.metadata,
    updated_at: new Date().toISOString(),
  };

  if (existingSubscription) {
    const { error } = await supabase
      .from("subscriptions")
      .update(subscriptionData)
      .eq("project_id", projectId)
      .eq("id", existingSubscription.id);

    if (error) throw error;
    return existingSubscription.id;
  }

  const { data: newSubscription, error } = await supabase
    .from("subscriptions")
    .insert({
      ...subscriptionData,
      creem_subscription_id: creemSubscription.id,
    })
    .select()
    .single();

  if (error) throw error;
  return newSubscription.id;
}

export async function getUserSubscription(userId: string) {
  const supabase = createServiceRoleClient();
  const projectId = await getProjectId(supabase);

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      `
      *,
      customers!inner(user_id, project_id)
    `
    )
    .eq("project_id", projectId)
    .eq("customers.project_id", projectId)
    .eq("customers.user_id", userId)
    .eq("status", "active")
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

export async function addCreditsToCustomer(
  customerId: string,
  credits: number,
  creemOrderId?: string,
  description?: string
) {
  const supabase = createServiceRoleClient();
  const projectId = await getProjectId(supabase);
  // Start a transaction
  const { data: client } = await supabase
    .from("customers")
    .select("credits")
    .eq("project_id", projectId)
    .eq("id", customerId)
    .single();
  if (!client) throw new Error("Customer not found");
  console.log("🚀 ~ 1client:", client);
  console.log("🚀 ~ 1credits:", credits);
  const newCredits = (client.credits || 0) + credits;

  // Update customer credits
  const { error: updateError } = await supabase
    .from("customers")
    .update({ credits: newCredits, updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("id", customerId);

  if (updateError) throw updateError;

  // Record the transaction in credits_history
  const { error: historyError } = await supabase
    .from("credits_history")
    .insert({
      project_id: projectId,
      customer_id: customerId,
      amount: credits,
      type: "add",
      description: description || "Credits purchase",
      creem_order_id: creemOrderId,
    });

  if (historyError) throw historyError;

  return newCredits;
}

export async function useCredits(
  customerId: string,
  credits: number,
  description: string
) {
  const supabase = createServiceRoleClient();
  const projectId = await getProjectId(supabase);

  // Start a transaction
  const { data: client } = await supabase
    .from("customers")
    .select("credits")
    .eq("project_id", projectId)
    .eq("id", customerId)
    .single();
  if (!client) throw new Error("Customer not found");
  if ((client.credits || 0) < credits) throw new Error("Insufficient credits");

  const newCredits = client.credits - credits;

  // Update customer credits
  const { error: updateError } = await supabase
    .from("customers")
    .update({ credits: newCredits, updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("id", customerId);

  if (updateError) throw updateError;

  // Record the transaction in credits_history
  const { error: historyError } = await supabase
    .from("credits_history")
    .insert({
      project_id: projectId,
      customer_id: customerId,
      amount: credits,
      type: "subtract",
      description,
    });

  if (historyError) throw historyError;

  return newCredits;
}

export async function getCustomerCredits(customerId: string) {
  const supabase = createServiceRoleClient();
  const projectId = await getProjectId(supabase);

  const { data, error } = await supabase
    .from("customers")
    .select("credits")
    .eq("project_id", projectId)
    .eq("id", customerId)
    .single();

  if (error) throw error;
  return data?.credits || 0;
}

export async function getCreditsHistory(customerId: string) {
  const supabase = createServiceRoleClient();
  const projectId = await getProjectId(supabase);

  const { data, error } = await supabase
    .from("credits_history")
    .select("*")
    .eq("project_id", projectId)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
