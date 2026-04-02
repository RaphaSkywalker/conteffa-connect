const headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udWlhaG9wZnZ6amF1a3lyZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDc2MTIsImV4cCI6MjA4ODA4MzYxMn0.IJYziSNKoa4VwXj_OuOcW6M86If_BYy40tAyCFElTvs",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udWlhaG9wZnZ6amF1a3lyZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDc2MTIsImV4cCI6MjA4ODA4MzYxMn0.IJYziSNKoa4VwXj_OuOcW6M86If_BYy40tAyCFElTvs"
};

async function checkSchema() {
    console.log("\nFetching OpenAPI spec...");
    const openapiUrl = `https://onuiahopfvzjaukyrfwd.supabase.co/rest/v1/?apikey=${headers.apikey}`;
    const openapiRes = await fetch(openapiUrl);
    const openapiData = await openapiRes.json();
    
    if (openapiData.definitions && openapiData.definitions.registrations) {
        console.log("Registrations schema properties:", Object.keys(openapiData.definitions.registrations.properties));
    } else {
        console.log("No registrations definition found.");
        console.log(Object.keys(openapiData.definitions || {}));
    }
}

checkSchema();
