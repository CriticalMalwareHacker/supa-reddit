const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password === ADMIN_PASSWORD) {
    return Response.json({ token: "admin-token" })
  }

  return Response.json({ error: "Invalid password" }, { status: 401 })
}
