# Brainrot Bites

Transform your study notes into addictive, TikTok-style short-form videos with AI-powered narration.

## Overview

Brainrot Bites is an AI-powered video generator that converts long-form text (notes, PDFs, articles) into engaging, bite-sized video clips perfect for social media. The app uses Google's Gemini AI to extract key facts and concepts, then presents them in a rapid-fire, "brainrot" style format with text-to-speech narration and word-by-word animations.

## Features

- **AI Text Summarization**: Upload text or PDF files and let Gemini AI extract the most interesting facts
- **Text-to-Speech**: Browser-based TTS narrates each clip with Gen Z style delivery
- **Word-by-Word Animation**: Text appears synchronized with speech for maximum engagement
- **Background Videos**: Random selection of classic brainrot backgrounds (Subway Surfers, Minecraft Parkour)
- **Vertical Video Format**: Mobile-first 9:16 aspect ratio perfect for TikTok/Instagram Reels
- **Interactive Player**: Swipe navigation, keyboard controls, and progress tracking
- **Shuffle & Reset**: Randomize clip order or start fresh with new content

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **AI**: Google Gemini 2.5 Flash
- **TTS**: Web Speech API (browser-native)
- **Video**: MP4 background assets

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jacobberko/brainrot-bites.git
cd brainrot-bites
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:8080`

## Usage

1. **Upload Content**: Drag and drop or select a text/PDF file
2. **Generate**: Click the generate button to create video clips
3. **Watch & Navigate**:
   - Swipe up/down or use arrow keys to navigate clips
   - Press spacebar to pause/play
   - Click shuffle to randomize order
   - Click reset to start over

## Configuration

### Video Duration

Default clip duration is set to 30 seconds. To change this, modify the `duration` constant in `src/pages/Index.tsx`:

```typescript
const duration: VideoDuration = 30; // Change to 15, 30, or 60
```

### Background Videos

Add custom background videos by placing MP4 files in `src/assets/videos/` and updating the imports in `src/lib/summarizeContent.ts`.

### AI Prompt Customization

Modify the system prompt in `src/lib/summarizeContent.ts` to adjust the AI's tone, style, and output format.

## Project Structure

```
brainrot-bites/
├── src/
│   ├── assets/videos/       # Background video files
│   ├── components/          # React components
│   │   ├── VideoPlayer.tsx  # Main video player
│   │   ├── FileUpload.tsx   # File upload interface
│   │   └── ...
│   ├── lib/                 # Utility functions
│   │   └── summarizeContent.ts  # AI integration
│   ├── pages/               # Page components
│   │   └── Index.tsx        # Main app page
│   └── types/               # TypeScript types
```

## API Costs

This app uses Google Gemini 2.5 Flash API. Check [Google AI pricing](https://ai.google.dev/pricing) for current rates. The app includes retry logic for rate limits.

## Browser Support

- Chrome/Edge (recommended for best TTS voices)
- Safari (limited voice selection)
- Firefox (limited voice selection)

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
