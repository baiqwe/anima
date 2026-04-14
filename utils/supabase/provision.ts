import { createServiceRoleClient } from "./service-role";
import { getAppKey, getProjectId } from "./project";

const DEFAULT_PROJECT_CREDITS = 3;

type ProvisionUser = {
  id: string;
  email?: string | null;
};

export async function ensureProjectCustomer(user: ProvisionUser) {
  const serviceSupabase = createServiceRoleClient();
  const projectId = await getProjectId(serviceSupabase);

  const { data: existingCustomer, error: existingCustomerError } = await serviceSupabase
    .from("customers")
    .select("id, credits")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingCustomerError) {
    throw existingCustomerError;
  }

  if (existingCustomer) {
    return existingCustomer;
  }

  if (!user.email) {
    throw new Error("Cannot provision project customer without user email");
  }

  const { data: insertedCustomer, error: insertCustomerError } = await serviceSupabase
    .from("customers")
    .insert({
      project_id: projectId,
      user_id: user.id,
      creem_customer_id: `auto_${user.id}`,
      email: user.email.toLowerCase(),
      credits: DEFAULT_PROJECT_CREDITS,
      metadata: {
        source: "project_provisioning",
        app_key: getAppKey(),
        initial_credits: DEFAULT_PROJECT_CREDITS,
      },
    })
    .select("id, credits")
    .single();

  if (insertCustomerError) {
    throw insertCustomerError;
  }

  const { error: historyError } = await serviceSupabase
    .from("credits_history")
    .insert({
      project_id: projectId,
      customer_id: insertedCustomer.id,
      amount: DEFAULT_PROJECT_CREDITS,
      type: "add",
      description: "Welcome bonus: 3 credits for project signup",
      metadata: {
        source: "project_provisioning",
        app_key: getAppKey(),
        initial_credits: DEFAULT_PROJECT_CREDITS,
      },
    });

  if (historyError) {
    throw historyError;
  }

  return insertedCustomer;
}
