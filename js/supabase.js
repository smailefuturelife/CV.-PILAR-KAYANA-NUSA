console.log("supabase.js loaded");

// ❗ JANGAN DOUBLE DECLARE
window.supabaseClient = window.supabase.createClient(
  "https://sflzsfdcmbmcpaapqvwl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbHpzZmRjbWJtY3BhYXBxdndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzMyMzYsImV4cCI6MjA4OTg0OTIzNn0.MEWfN8mkxk55vTlyU7alRDgD-JWgvAQ7JzWZBS1StQs"
);