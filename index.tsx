import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  Deck,
  DefaultTemplate,
  MarkdownSlideSet,
  defaultTheme,
} from 'spectacle';
import mdContent from './slides.md';

const theme = {
  ...defaultTheme,
  fontSizes: {
    h1: '3rem',
    h2: '2rem',
    text: '1.5rem',
  },
};

const Presentation = () => (
  <Deck theme={theme} template={() => <DefaultTemplate />}>
    <MarkdownSlideSet>{mdContent}</MarkdownSlideSet>
  </Deck>
);

createRoot(document.getElementById('app')!).render(<Presentation />);