# Salman Agent

A personal AI agent that people can talk to, interact with, and ask questions about Salman.

## Features

- Dark theme with purple accents
- Chat interface with streaming responses
- Powered by Salesforce AgentForce API

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

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
SALESFORCE_AGENT_API_KEY=your_api_key
SALESFORCE_AGENT_ENDPOINT=your_endpoint
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Adding Your Profile Image

To add your profile image:

1. Place your profile image in the `public` directory
2. Name it `profile.jpg` (or update the image path in `app/page.tsx`)
3. Uncomment the Image component in `app/page.tsx`:

```tsx
<Image 
  src="/profile.jpg" 
  alt="Salman's Profile" 
  fill 
  className="object-cover"
/>
```

4. Comment out or remove the placeholder:

```tsx
{/* <div className="absolute inset-0 flex items-center justify-center bg-secondary text-secondary-foreground">
  <span className="text-4xl font-bold">S</span>
</div> */}
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