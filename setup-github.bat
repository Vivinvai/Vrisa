@echo off
echo ================================================
echo   Vrisa - GitHub Repository Setup
echo ================================================
echo.
echo STEP 1: Create GitHub Repository
echo --------------------------------
echo 1. Go to: https://github.com/new
echo 2. Repository name: Vrisa
echo 3. Description: End-to-end encrypted chat with Next.js
echo 4. Keep it Public
echo 5. DO NOT check "Add README" (we already have one)
echo 6. Click "Create repository"
echo.
pause
echo.
echo STEP 2: Enter Your GitHub Username
echo -----------------------------------
set /p USERNAME="Enter your GitHub username: "
echo.
echo STEP 3: Adding Remote Repository
echo ---------------------------------
git remote remove origin 2>nul
git remote add origin https://github.com/%USERNAME%/Vrisa.git
echo Remote added successfully!
echo.
echo STEP 4: Pushing to GitHub
echo -------------------------
echo Pushing your code to GitHub...
git push -u origin main
echo.
echo ================================================
echo   SUCCESS! Your code is now on GitHub
echo ================================================
echo.
echo Repository URL: https://github.com/%USERNAME%/Vrisa
echo.
echo NEXT STEPS:
echo 1. Visit your repository on GitHub
echo 2. Follow GITHUB_SETUP.md for Vercel deployment
echo 3. Set up free database (Neon, Supabase, or Railway)
echo.
pause
