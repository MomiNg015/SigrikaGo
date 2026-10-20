// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toast, ToastStack } from "./FeedbackModals.jsx";

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });
const advance = (ms) => act(() => vi.advanceTimersByTime(ms));

describe("paper toast lifecycle", () => {
  it("keeps the 2600ms hold and 400ms exit in Strict Mode with the latest callback", () => {
    const oldClose = vi.fn();
    const onClose = vi.fn();
    const { container, rerender } = render(<StrictMode><Toast text="已保存" tone="success" onClose={oldClose} /></StrictMode>);
    advance(2000);
    rerender(<StrictMode><Toast text="已保存" tone="success" onClose={onClose} /></StrictMode>);
    advance(599);
    expect(container.querySelector('.toast').dataset.exiting).toBeUndefined();
    advance(1);
    expect(container.querySelector('.toast').dataset.exiting).toBe("true");
    advance(399);
    expect(onClose).not.toHaveBeenCalled();
    advance(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(oldClose).not.toHaveBeenCalled();
  });

  it("preserves remaining time while hover and keyboard focus overlap", () => {
    const onClose = vi.fn();
    const { container } = render(<Toast text="请稍后重试" onClose={onClose} />);
    const toast = container.querySelector('.toast');
    const close = screen.getByRole('button', { name: '关闭提示' });
    advance(1000);
    fireEvent.mouseEnter(toast);
    fireEvent.focus(close);
    advance(5000);
    fireEvent.mouseLeave(toast);
    advance(5000);
    expect(onClose).not.toHaveBeenCalled();
    expect(toast.dataset.paused).toBe("true");
    fireEvent.blur(close, { relatedTarget: document.body });
    advance(1599);
    expect(toast.dataset.exiting).toBeUndefined();
    advance(1);
    expect(toast.dataset.exiting).toBe("true");
    advance(400);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("manual close finishes once even while paused", () => {
    const onClose = vi.fn();
    const { container } = render(<Toast text="新邮件" tone="mail" onClose={onClose} />);
    fireEvent.mouseEnter(container.querySelector('.toast'));
    fireEvent.click(screen.getByRole('button', { name: '关闭提示' }));
    advance(400);
    expect(onClose).toHaveBeenCalledTimes(1);
    advance(6000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cleans up timers when a queue entry is removed", () => {
    const onClose = vi.fn();
    const { unmount } = render(<Toast text="消息" onClose={onClose} />);
    advance(2600);
    unmount();
    advance(1000);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("maps error aliases, retains message text and closes the matching queue ID", () => {
    const onClose = vi.fn();
    const { container } = render(<ToastStack toasts={[{id: 7, text: '房间已满', tone: 'error'}, {id: 6, text: '已保存', tone: 'success'}]} onClose={onClose} />);
    expect(container.querySelector('.toast-stack').getAttribute('aria-live')).toBe('polite');
    expect(container.querySelector('.toast').classList.contains('danger')).toBe(true);
    expect(screen.getByText('房间已满')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: '关闭提示' })[0]);
    advance(400);
    expect(onClose).toHaveBeenCalledWith(7);
  });
});
