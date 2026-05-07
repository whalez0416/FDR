import { supabase } from './lib/supabase/client';

async function checkData() {
  const { count: mallCount, error: mallError } = await supabase
    .from('malls')
    .select('*', { count: 'exact', head: true });
  
  const { count: restaurantCount, error: restError } = await supabase
    .from('restaurants')
    .select('*', { count: 'exact', head: true });

  console.log(`Malls: ${mallCount}`);
  console.log(`Restaurants: ${restaurantCount}`);
  
  if (mallError || restError) {
    console.error('Error fetching counts:', mallError || restError);
  }
}

checkData();
