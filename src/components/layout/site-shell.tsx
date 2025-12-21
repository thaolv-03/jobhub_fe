"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/layout/container";

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-background py-6">
        <Container className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} JobHub. All rights reserved. |{" "}
          <Link href="/dieu-khoan" className="hover:text-primary">Điều khoản</Link> |{" "}
          <Link href="/chinh-sach" className="hover:text-primary">Chính sách</Link>
        </Container>
      </footer>
    </div>
  );
}
