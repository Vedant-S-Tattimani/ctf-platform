import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        overlay: 'var(--bg-overlay)',
        glass: 'var(--bg-glass)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        inverse: 'var(--text-inverse)',
        accent: {
          DEFAULT: 'var(--accent)',
          strong: 'var(--accent-strong)',
          deep: 'var(--accent-deep)',
          faint: 'var(--accent-faint)',
        },
        info: {
          DEFAULT: 'var(--secondary)',
          faint: 'var(--secondary-faint)',
        },
        success: {
          DEFAULT: 'var(--success)',
          faint: 'var(--success-faint)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          faint: 'var(--warning-faint)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          faint: 'var(--danger-faint)',
        },
        hairline: 'var(--border-hairline)',
        subtle: 'var(--border-subtle)',
        strong: 'var(--border-strong)',
        scrim: 'var(--bg-scrim)',
      },
      borderColor: {
        accent: 'var(--border-accent)',
        info: 'var(--border-info)',
        success: 'var(--border-success)',
        warning: 'var(--border-warning)',
        danger: 'var(--border-danger)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        display: [
          'var(--text-display)',
          {
            lineHeight: 'var(--text-display--leading)',
            fontWeight: 'var(--text-display--weight)',
            letterSpacing: 'var(--text-display--tracking)',
          },
        ],
        h1: [
          'var(--text-h1)',
          {
            lineHeight: 'var(--text-h1--leading)',
            fontWeight: 'var(--text-h1--weight)',
            letterSpacing: 'var(--text-h1--tracking)',
          },
        ],
        h2: [
          'var(--text-h2)',
          {
            lineHeight: 'var(--text-h2--leading)',
            fontWeight: 'var(--text-h2--weight)',
            letterSpacing: 'var(--text-h2--tracking)',
          },
        ],
        h3: [
          'var(--text-h3)',
          {
            lineHeight: 'var(--text-h3--leading)',
            fontWeight: 'var(--text-h3--weight)',
            letterSpacing: 'var(--text-h3--tracking)',
          },
        ],
        label: [
          'var(--text-label)',
          {
            lineHeight: 'var(--text-label--leading)',
            fontWeight: 'var(--text-label--weight)',
            letterSpacing: 'var(--text-label--tracking)',
          },
        ],
        body: ['var(--text-body)', { lineHeight: 'var(--text-body--leading)' }],
        small: ['var(--text-small)', { lineHeight: 'var(--text-small--leading)' }],
        mono: ['var(--text-mono)', { lineHeight: 'var(--text-mono--leading)' }],
      },
      spacing: {
        band: 'var(--space-24)',
        'band-lg': 'var(--space-32)',
        'band-xl': 'var(--space-48)',
      },
      maxWidth: {
        container: 'var(--container-max)',
        measure: 'var(--measure)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },
      transitionDuration: {
        instant: '120ms',
        fast: '200ms',
        base: '350ms',
        slow: '650ms',
      },
      transitionTimingFunction: {
        decel: 'cubic-bezier(0.16, 1, 0.3, 1)',
        accel: 'cubic-bezier(0.7, 0, 0.84, 0)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
        float: 'var(--shadow-float)',
        panel: 'var(--shadow-panel)',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
      },
    },
  },
  plugins: [],
} satisfies Config;
