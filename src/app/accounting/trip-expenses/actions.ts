"use server";
import{revalidatePath}from"next/cache";import{createAdminClient}from"@/lib/supabase/admin";
function refresh(){for(const path of["/accounting/trip-expenses","/accounting/expenses","/accounting","/accounting/accounts","/accounting/ledger","/trips"])revalidatePath(path)}
export async function postTripFuel(data:FormData){const id=String(data.get("trip_id")??"");if(!id)return;const{error}=await(await createAdminClient()).rpc("post_trip_fuel",{target_trip_id:id});if(error)throw new Error(error.message);refresh()}
export async function postTripDelivery(data:FormData){const id=String(data.get("trip_id")??"");if(!id)return;const{error}=await(await createAdminClient()).rpc("post_trip_delivery",{target_trip_id:id});if(error)throw new Error(error.message);refresh()}
export async function postTripCashHandover(data:FormData){const id=String(data.get("trip_id")??"");if(!id)return;const{error}=await(await createAdminClient()).rpc("post_trip_cash_handover",{target_trip_id:id});if(error)throw new Error(error.message);refresh()}
