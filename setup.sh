#!/bin/bash

# Salesforce Agent Web Chat Setup Script

echo "Setting up Salesforce Agent Web Chat..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install requests python-dotenv sseclient-py

# Copy the Salesforce Agent client if it exists
if [ -f "../salesforce_agent_streaming_client.py" ]; then
    echo "Copying Salesforce Agent client..."
    cp ../salesforce_agent_streaming_client.py .
else
    echo "Warning: salesforce_agent_streaming_client.py not found in parent directory."
    echo "Please copy it manually to the project root."
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating sample .env file..."
    cat > .env << EOL
# Salesforce Agent API credentials
BOT_ID=your_bot_id
AFP_API_URL=your_afp_api_url
CORE_URL=your_core_url
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
EOL
    echo "Please update the .env file with your Salesforce credentials."
fi

echo "Setup complete! Run 'npm run dev' to start the development server." 