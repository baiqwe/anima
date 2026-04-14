import { createClient } from "@/utils/supabase/server";
import { getProjectId } from "@/utils/supabase/project";

export class CreditError extends Error {
    code: string;
    constructor(message: string, code: 'INSUFFICIENT_CREDITS' | 'USER_NOT_FOUND' | 'DB_ERROR' = 'DB_ERROR') {
        super(message);
        this.code = code;
    }
}

export async function getUserCredits(userId: string) {
    const supabase = await createClient();
    const projectId = await getProjectId(supabase);

    const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // Customer not found, try to create one if user exists in Auth
            const { data: { user } } = await supabase.auth.getUser();

            if (user && user.id === userId && user.email) {
                const { data: newCustomer, error: createError } = await supabase
                    .from('customers')
                    .insert({
                        project_id: projectId,
                        user_id: userId,
                        email: user.email,
                        credits: 3, // Default signup bonus
                        creem_customer_id: `auto_${userId}`,
                        metadata: { source: 'auto_recovery', initial_credits: 3 }
                    })
                    .select()
                    .single();

                if (!createError && newCustomer) {
                    return { credits: newCustomer.credits, customer: newCustomer };
                } else {
                    // Fail silently but safely defaults will be returned
                }
            }

            return { credits: 0, customer: null };
        }
        throw new CreditError(error.message);
    }

    return { credits: customer.credits, customer };
}

export async function deductCredits(userId: string, amount: number, description: string) {
    const supabase = await createClient();
    const projectId = await getProjectId(supabase);

    // Get current balance
    const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('id, credits')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();

    if (fetchError || !customer) {
        throw new CreditError('User record not found', 'USER_NOT_FOUND');
    }

    if (customer.credits < amount) {
        throw new CreditError('Insufficient credits', 'INSUFFICIENT_CREDITS');
    }

    // Update balance
    const newBalance = customer.credits - amount;
    const { error: updateError } = await supabase
        .from('customers')
        .update({
            credits: newBalance,
            updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('id', customer.id);

    if (updateError) {
        throw new CreditError(updateError.message);
    }

    // Log history
    await supabase.from('credits_history').insert({
        project_id: projectId,
        customer_id: customer.id,
        amount: amount,
        type: 'subtract',
        description: description,
        metadata: {
            operation: 'deduct',
            credits_before: customer.credits,
            credits_after: newBalance
        }
    });

    return newBalance;
}

export async function addCredits(userId: string, amount: number, description: string) {
    const supabase = await createClient();
    const projectId = await getProjectId(supabase);

    const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('id, credits')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();

    if (fetchError || !customer) {
        throw new CreditError('User record not found', 'USER_NOT_FOUND');
    }

    const newBalance = customer.credits + amount;

    const { error: updateError } = await supabase
        .from('customers')
        .update({
            credits: newBalance,
            updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('id', customer.id);

    if (updateError) {
        throw new CreditError(updateError.message);
    }

    await supabase.from('credits_history').insert({
        project_id: projectId,
        customer_id: customer.id,
        amount: amount,
        type: 'add',
        description: description,
        metadata: {
            operation: 'add',
            credits_before: customer.credits,
            credits_after: newBalance
        }
    });

    return newBalance;
}
