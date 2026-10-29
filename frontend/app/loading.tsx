import Image from "next/image";

export default function Loading() {
  return (
    <main className="site-loader" role="status" aria-label="Loading Neuraview">
      <Image
        src="/neuraview-loader.png"
        alt=""
        width={960}
        height={720}
        priority
        className="site-loader__logo"
      />
      <span className="sr-only">Loading Neuraview</span>
    </main>
  );
}
