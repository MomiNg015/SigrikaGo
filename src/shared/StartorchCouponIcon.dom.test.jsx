// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StartorchCouponIcon, { CouponText, couponNotice } from "./StartorchCouponIcon.jsx";
import ShopItemCard from "../modals/shop/ShopItemCard.jsx";

afterEach(cleanup);

const item = {
  id: "coupon-test-item", name: "测试道具", category: "item",
  priceCoins: 100, finalPrice: 80, discountPercent: 20, purchasable: true
};

describe("authored coupon currency", () => {
  it("keeps an accessible currency name and the original image proportions", () => {
    render(<StartorchCouponIcon size={22} />);
    const icon = screen.getByRole("img", { name: "星炬券" });
    expect(icon.getAttribute("src")).toBe("/assets/ui/startorch-coupon.webp");
    expect(icon.width / icon.height).toBe(827 / 746);
    expect(icon.parentElement.style.width).toBe("22px");
  });

  it("replaces currency words in legacy and current shop dialogue without changing surrounding copy", () => {
    const { container } = render(<CouponText>还差10金币，星炬券可以从对局获得。</CouponText>);
    expect(container.textContent).toBe("还差10，可以从对局获得。");
    expect(screen.getAllByRole("img", { name: "星炬券" })).toHaveLength(2);
  });

  it("renders legacy server currency errors as icons and preserves non-currency errors", () => {
    render(couponNotice("金币不足"));
    expect(screen.getByRole("img", { name: "星炬券" })).toBeTruthy();
    expect(screen.getByText("不足")).toBeTruthy();
    expect(couponNotice("网络异常")).toBe("网络异常");
  });

  it("retains discounted prices and blocks a purchase when the balance is insufficient", () => {
    const onBuy = vi.fn();
    const { container } = render(<ShopItemCard item={item} user={{ coins: 79 }} onBuy={onBuy} />);
    expect(screen.getByText("80")).toBeTruthy();
    expect(container.querySelector("s").textContent).toBe("100");
    const buy = screen.getByRole("button", { name: "星炬券不足" });
    expect(buy.disabled).toBe(true);
    fireEvent.click(buy);
    expect(onBuy).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain("金币");
  });

  it("allows a zero-price item to be purchased with zero balance", () => {
    const onBuy = vi.fn();
    const freeItem = { ...item, priceCoins: 0, finalPrice: 0, discountPercent: 0 };
    render(<ShopItemCard item={freeItem} user={{ coins: 0 }} onBuy={onBuy} />);
    expect(screen.getByText("0", { selector: "b" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "星炬券" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "购买" }));
    expect(onBuy).toHaveBeenCalledWith(freeItem);
  });
});
