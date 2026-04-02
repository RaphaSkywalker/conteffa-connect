const url = "https://onuiahopfvzjaukyrfwd.supabase.co/rest/v1/registrations?select=*&limit=1";
const headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udWlhaG9wZnZ6amF1a3lyZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDc2MTIsImV4cCI6MjA4ODA4MzYxMn0.IJYziSNKoa4VwXj_OuOcW6M86If_BYy40tAyCFElTvs",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udWlhaG9wZnZ6amF1a3lyZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDc2MTIsImV4cCI6MjA4ODA4MzYxMn0.IJYziSNKoa4VwXj_OuOcW6M86If_BYy40tAyCFElTvs"
};

async function testSupabase() {
    console.log("Fetching a registration...");
    const res = await fetch(url, { headers });
    const data = await res.json();
    
    if (data.length === 0) {
        console.log("No registrations found.");
        return;
    }
    
    const reg = data[0];
    console.log("Keys in DB:", Object.keys(reg));
    
    // Attempt an empty update to see if it throws an error
    console.log("\nAttempting dummy update...");
    const updateUrl = `https://onuiahopfvzjaukyrfwd.supabase.co/rest/v1/registrations?id=eq.${reg.id}`;
    
    // We send back the exact same data to see if Supabase rejects it.
    // Notice that Supabase might reject "id" in the payload if it's read-only, but usually it ignores it or accepts it if identical.
    // Dashboard.tsx strips 'id' and 'acompanhantesNames'
    const { id, acompanhantesNames, ...dataToUpdate } = reg;
    
    const upRes = await fetch(updateUrl, {
        method: "PATCH",
        headers: {
            ...headers,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        body: JSON.stringify(dataToUpdate)
    });
    
    const upData = await upRes.json();
    console.log("Update response:", upData);
}

testSupabase();
