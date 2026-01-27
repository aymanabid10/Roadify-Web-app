### Dev scratchpad

- [Yassine 22/01] Restrucutured the project a bit. Moved the solution file inside the backend/ and renamed the old backend to apiroot/
- [Yassine 22/01] Removed all the MVC uneeded stuff and added Swagger.

### appsettings.Development.json example :


`appsettings.Development.json` content for dev mode:

```

{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "Port": 587,
    "SenderName": "roadify",
    "SenderEmail": "roadify@gmail.com",
    "Username": "roadify@gmail.com",
    "Password": "app_password",
    "EnableSsl": true
  },
  
  "AllowedHosts": "*",
    "AllowedOrigins": [
        "http://localhost:3000",
        "https://localhost:3000"
    ],
  
    "FrontendUrl": "http://localhost:3000",
    
    "ConnectionStrings": {
        "DefaultConnection": "Host=localhost;Database=roadify_db_v1;Username=postgres;Password=pass"
    },

    "Jwt": {
        "Key": "94f8ea0aab73d699b24e25ca5f00e02b479bf4e5eabfd885804061ee09703ddc",
        "Issuer": "roadify-api",
        "Audience": "roadify-web-app",
        "ExpiryMinutes": 60
    },
    "AdminPassword": "Admin@123",

    "MongoDbSettings": {
      "ConnectionString": "mongodb://localhost:27017",
      "Database": "roadify_db_v1"
    }
}

```