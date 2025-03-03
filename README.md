# Salesforce Agent Web Chat

A web-based chat interface for interacting with Salesforce Agent API.

> **Disclaimer**: This is a test application designed to showcase the capabilities of the Salesforce AgentForce API. It demonstrates how to build a web interface that connects to the Salesforce Agent API.

## Features

- Dark theme with purple accents
- Chat interface with streaming responses
- Powered by Salesforce AgentForce API

## Salesforce Agent API Setup

To access the Salesforce Agent API, you must set up a connected app that supports the client credential flow. Follow these steps:

1. Create a connected app in your Salesforce org
2. Configure the connected app to use the client credentials flow
3. Obtain your client ID, client secret, and other required credentials
4. Set up your environment variables as described below

For detailed instructions on setting up the Salesforce Agent API, please refer to the official documentation:
[Salesforce Agent API Getting Started Guide](https://developer.salesforce.com/docs/einstein/genai/guide/agent-api-get-started.html)

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Salesforce connected app credentials

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up your environment variables in `.env`:

```
# Salesforce Agent API credentials
BOT_ID=your_bot_id
AFP_API_URL=your_afp_api_url
CORE_URL=your_core_url
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Avatar Customization

The app uses a placeholder avatar by default. To customize it:

1. Replace the `/public/profile.png` file with your own image (keeping the same filename)
2. Or update the image path in `app/page.tsx` to point to your custom image

If you prefer to use a text-based avatar instead of an image:

```tsx
{/* Comment out or remove the Image component */}
{/* <Image 
  src="/profile.png" 
  alt="Profile" 
  fill 
  className="object-cover"
/> */}

{/* Use this text-based avatar instead */}
<div className="absolute inset-0 flex items-center justify-center bg-secondary text-secondary-foreground">
  <span className="text-4xl font-bold">A</span> {/* Use your initial or icon */}
</div>
```

## Customization

You can customize the theme colors in `app/globals.css`. The current theme uses:

- Dark background with purple accents
- Primary color: `267 75% 60%` (purple)
- Accent color: `267 75% 40%` (darker purple)

## Deployment

This application can be deployed on Vercel, Netlify, or any other platform that supports Next.js applications.

```bash
npm run build
# or
yarn build
```

## License

This project is licensed under the MIT License.