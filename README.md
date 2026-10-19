# form-guard

Client-side bot trap for React / Next.js forms. Honeypot + "submitted too fast" detection. Zero dependencies.

> **Client-side only.** It stops bots that drive your form in a browser. A bot that POSTs straight to your backend endpoint is not stopped. Pair with server-side validation or rate limiting for full protection.

## Install

```bash
npm i form-guard
```

## Use

### Basic React / Next.js Form

```tsx
"use client";
import { useFormGuard } from "form-guard";

export default function Contact() {
  const { Honeypot, guard } = useFormGuard({
    minTime: 2500,
    fieldName: "company_fax", // custom trap input name
    onBot: (reason) => console.warn("bot detected:", reason),
  });

  return (
    <form onSubmit={guard((e) => { e.preventDefault(); /* send */ })}>
      <Honeypot />
      <input name="email" type="email" required />
      <button type="submit">Send</button>
    </form>
  );
}
```

### With react-hook-form

```tsx
import { useForm } from "react-hook-form";
import { useFormGuard } from "form-guard";

export default function ContactForm() {
  const { register, handleSubmit } = useForm();
  const { Honeypot, guard } = useFormGuard({ minTime: 3000 });

  const onSubmit = (data) => {
    // only runs if human passed the guard
  };

  return (
    <form onSubmit={guard(handleSubmit(onSubmit))}>
      <Honeypot />
      <input {...register("email")} />
      <button type="submit">Send</button>
    </form>
  );
}
```

### Custom rendering with `honeypotProps`

If you prefer rendering the `<input>` element yourself:

```tsx
const { honeypotProps, guard } = useFormGuard();

return (
  <form onSubmit={guard(handleSubmit)}>
    <input {...honeypotProps} />
    {/* ... */}
  </form>
);
```

## How it works

The submit handler is **not** called, and `onBot(reason)` fires, when:

- `"honeypot"`: the hidden field is filled (scrapers and automated bots fill all inputs).
- `"too-fast"`: submit occurs less than `minTime` ms after client-side mount.

The block is silent, so the bot receives no error feedback to adapt.

## API

`useFormGuard({ minTime?, fieldName?, onBot? })` returns `{ Honeypot, honeypotProps, guard }`.

| Option | Default | Meaning |
|---|---|---|
| `minTime` | `3000` | Minimum ms between component mount and submit |
| `fieldName` | `"website_url"` | The HTML `name` attribute of the trap input |
| `onBot` | `undefined` | Callback fired with `"honeypot"` or `"too-fast"` |

### Return Values

- **`Honeypot`**: Pre-styled component to render inside your `<form>`. Off-screen, `aria-hidden`, `tabIndex=-1`, `autoComplete="off"`, password-manager ignored (`data-lpignore`, `data-1p-ignore`).
- **`honeypotProps`**: Attribute object to spread directly onto your own `<input />`.
- **`guard(handler)`**: Wraps any form submit handler (vanilla React or `react-hook-form`).

## SSR & Next.js Compatibility

Timers are initialized on client-side mount (`useEffect`), ensuring that static site generation (SSG) or server-side rendering (SSR) does not skew the `too-fast` threshold.

## License

MIT
