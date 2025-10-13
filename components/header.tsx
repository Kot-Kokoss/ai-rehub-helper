import { ModeToggle } from './ui/modeToggle';

export function Header() {
  return (
    <header className="flex items-center justify-between border-b-2 p-3 h-16">
      <h1 className="font-mono text-3xl">Ai rehub helper</h1>
      <ModeToggle></ModeToggle>
    </header>
  );
}
