@echo off
echo Deploying Supabase function...

REM Check if Supabase CLI is installed
where supabase >nul 2>&1
if %errorlevel% neq 0 (
    echo Supabase CLI not found. Installing...
    npm install -g supabase
)

echo Logging into Supabase...
supabase login

echo Linking to your Supabase project...
supabase link --project-ref aluodstxvbofgychxahg

echo Setting environment variables...
supabase secrets set GOOGLE_API_KEY=AIzaSyB1lXf933GGtnhsmvaqDj5A19w1zva11ZY

echo Deploying functions...
supabase functions deploy translate --project-ref aluodstxvbofgychxahg

echo Done! Your translation function is now available at:
echo https://aluodstxvbofgychxahg.supabase.co/functions/v1/translate

pause