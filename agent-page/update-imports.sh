#!/bin/bash

echo "🔄 Updating all baseUrl imports to use config..."

# List of files to update
files=(
  "src/components/NavBar.jsx"
  "src/components/Dashboard.jsx"
  "src/components/ContactSection.jsx"
  "src/components/Register.jsx"
  "src/contexts/ShiftContext.jsx"
  "src/pages/Analytics.jsx"
  "src/pages/CallHistory.jsx"
  "src/pages/CustomerTimeline.jsx"
  "src/pages/PhoneNumbers.jsx"
  "src/pages/QualityMonitoring.jsx"
  "src/pages/TeamCollaboration.jsx"
  "src/store/agentStats.jsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Updating $file..."
    # Replace the import statement
    sed -i "s/import { baseUrl } from '..\/baseUrl';/import { getApiUrl } from '..\/config';\nconst baseUrl = getApiUrl();/g" "$file"
    sed -i "s/import { baseUrl } from '..\/..\/baseUrl';/import { getApiUrl } from '..\/..\/config';\nconst baseUrl = getApiUrl();/g" "$file"
  fi
done

echo "✅ All files updated!"
