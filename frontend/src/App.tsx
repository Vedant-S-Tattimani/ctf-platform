import { MotionConfig } from 'motion/react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { DragonCursor } from './components/DragonCursor';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <DragonCursor />
      <RouterProvider router={router} />
    </MotionConfig>
  );
}
