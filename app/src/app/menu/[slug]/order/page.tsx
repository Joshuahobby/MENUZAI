import { redirect } from "next/navigation";

export default async function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/menu/${slug}`);
}
