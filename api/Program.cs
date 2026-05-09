using Microsoft.EntityFrameworkCore;
using Npgsql;
using Roski.Api.Features.Resorts;
using Roski.Api.Features.Viewer;
using Roski.Api.Features.Weather;
using Roski.Api.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();

var dataSource = new NpgsqlDataSourceBuilder(builder.Configuration.GetConnectionString("Roski"))
    .EnableDynamicJson() // allow POCO -> jsonb for List<WebcamLink>, GeoLineString
    .Build();
builder.Services.AddSingleton(dataSource);
builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(dataSource));

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? ["http://localhost:3000"];

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

var app = builder.Build();

// Apply migrations + seed on startup (dev convenience).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await Seed.RunAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

app.MapGet("/health", () => Results.Ok(new { status = "ok", time = DateTime.UtcNow }));

app.MapResortEndpoints();
app.MapViewerEndpoints();
app.MapWeatherEndpoints();

app.Run();
