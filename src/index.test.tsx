// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import React from "react";
import { useFormGuard } from "./index";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function setup(options?: Parameters<typeof useFormGuard>[0]) {
  const submit = vi.fn();
  const onBot = vi.fn();
  function F() {
    const { Honeypot, guard } = useFormGuard({ minTime: 3000, onBot, ...options });
    return (
      <form
        data-testid="f"
        onSubmit={guard((e: React.FormEvent) => {
          e.preventDefault();
          submit();
        })}
      >
        <Honeypot />
      </form>
    );
  }
  const r = render(<F />);
  return {
    submit,
    onBot,
    form: r.getByTestId("f"),
    trap: r.container.querySelector("input")!,
  };
}

it("blocks submit faster than minTime", () => {
  vi.useFakeTimers();
  const { submit, onBot, form } = setup();
  vi.advanceTimersByTime(1000);
  fireEvent.submit(form);
  expect(submit).not.toHaveBeenCalled();
  expect(onBot).toHaveBeenCalledWith("too-fast");
});

it("blocks when honeypot is filled", () => {
  vi.useFakeTimers();
  const { submit, onBot, form, trap } = setup();
  vi.advanceTimersByTime(5000);
  fireEvent.change(trap, { target: { value: "spam" } });
  fireEvent.submit(form);
  expect(submit).not.toHaveBeenCalled();
  expect(onBot).toHaveBeenCalledWith("honeypot");
});

it("lets a human through", () => {
  vi.useFakeTimers();
  const { submit, onBot, form } = setup();
  vi.advanceTimersByTime(5000);
  fireEvent.submit(form);
  expect(submit).toHaveBeenCalledOnce();
  expect(onBot).not.toHaveBeenCalled();
});

it("supports custom fieldName and anti-autofill attributes", () => {
  const { trap } = setup({ fieldName: "fax_number" });
  expect(trap.getAttribute("name")).toBe("fax_number");
  expect(trap.getAttribute("aria-hidden")).toBe("true");
  expect(trap.getAttribute("data-lpignore")).toBe("true");
  expect(trap.getAttribute("data-1p-ignore")).toBe("true");
  expect(trap.getAttribute("tabindex")).toBe("-1");
});

it("supports spreading honeypotProps directly", () => {
  vi.useFakeTimers();
  const submit = vi.fn();
  const onBot = vi.fn();

  function CustomForm() {
    const { honeypotProps, guard } = useFormGuard({
      minTime: 2000,
      fieldName: "custom_trap",
      onBot,
    });
    return (
      <form
        data-testid="custom-form"
        onSubmit={guard((e: React.FormEvent) => {
          e.preventDefault();
          submit();
        })}
      >
        <input {...honeypotProps} data-testid="custom-input" />
      </form>
    );
  }

  const r = render(<CustomForm />);
  const trap = r.getByTestId("custom-input") as HTMLInputElement;
  const form = r.getByTestId("custom-form");

  expect(trap.name).toBe("custom_trap");

  vi.advanceTimersByTime(3000);
  fireEvent.change(trap, { target: { value: "bot-payload" } });
  fireEvent.submit(form);

  expect(submit).not.toHaveBeenCalled();
  expect(onBot).toHaveBeenCalledWith("honeypot");
});
