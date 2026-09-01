"use server";
import{revalidatePath}from"next/cache";import{createAdminClient}from"@/lib/supabase/admin";
function refresh(){revalidatePath("/accounting/trip-expenses");revalidatePath("/accounting/expenses");revalidatePath("/accounting");revalidatePath("/accounting/ledger")}
export async function postTripFuel(data:FormData){const id=String(data.get("trip_id")??"");if(!id)return;const{error}=await(await createAdminClient()).rpc("post_trip_fuel",{target_trip_id:id});if(error)throw new Error(error.message);refresh()}
export async function postTripDelivery(data:FormData){const id=String(data.get("trip_id")??"");if(!id)return;const{error}=await(await createAdminClient()).rpc("post_trip_delivery",{target_trip_id:id});if(error)throw new Error(error.message);refresh()}
