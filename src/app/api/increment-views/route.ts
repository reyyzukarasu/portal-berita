import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json({ error: "Post ID tidak disediakan" }, { status: 400 });
    }

    // Log untuk debugging
    console.log(`Updating views for post ID: ${postId}`);

    // Endpoint untuk post di WordPress
    const wpApiUrl = `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/posts/${postId}`;

    // Fetch data post dari WordPress
    const postRes = await fetch(wpApiUrl);
    if (!postRes.ok) {
      return NextResponse.json({ error: "Gagal mendapatkan data post" }, { status: 500 });
    }
    const postData = await postRes.json();

    // Tambahkan views +1
    const updatedViews = (postData.views || 0) + 1;

    // Perbarui data views di WordPress
    const updateRes = await fetch(wpApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_WORDPRESS_TOKEN}`,
      },
      body: JSON.stringify({
        views: updatedViews,
      }),
    });

    if (!updateRes.ok) {
      const errorBody = await updateRes.json();
      return NextResponse.json(
        { error: `Gagal memperbarui views: ${errorBody.message}` },
        { status: updateRes.status }
      );
    }

    return NextResponse.json({ updatedViews });
  } catch (err) {
    console.error("Terjadi kesalahan:", err);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
