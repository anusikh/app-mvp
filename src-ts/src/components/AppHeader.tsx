import { MenuIcon, SlidersIcon, TerminalPromptIcon } from './Icons';

type AppHeaderProps = {
  onOpenDebug: () => void;
};

export function AppHeader({ onOpenDebug }: AppHeaderProps) {
  return (
    <header className='app-header'>
      <button
        aria-label='Open session menu'
        className='icon-button'
        onClick={onOpenDebug}
        title='Session menu'
        type='button'
      >
        <MenuIcon size={22} />
      </button>

      <div className='brand-lockup' aria-label='Pi'>
        <span className='brand-prompt'>
          <TerminalPromptIcon size={18} />
        </span>
        <span className='brand-word'>PI</span>
      </div>

      <div className='header-divider' aria-hidden='true' />

      <div className='header-spacer' />

      <button
        aria-label='Open diagnostics'
        className='icon-button'
        onClick={onOpenDebug}
        title='Diagnostics'
        type='button'
      >
        <SlidersIcon size={20} />
      </button>
    </header>
  );
}
