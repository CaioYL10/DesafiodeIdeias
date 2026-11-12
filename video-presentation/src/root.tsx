import React from 'react';
import {Composition} from 'remotion';
import {Film} from './scenes/Film';

export const FPS = 30;
export const DURATION = 82 * FPS;

export const Root: React.FC = () => <Composition
  id="CrmCti"
  component={Film}
  durationInFrames={DURATION}
  fps={FPS}
  width={1920}
  height={1080}
/>;
