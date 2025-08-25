@echo off
echo Fixing CSS Processing Issues...

echo 1. Cleaning node_modules and package-lock...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo 2. Installing compatible dependencies...
npm install

echo 3. Verifying Tailwind CSS...
npx tailwindcss --version

echo 4. Testing build process...
npm run build

echo CSS Processing Fix Complete!
pause
