export default function Unauthorized() {
  return (
    <div className="flex h-screen items-center justify-center">
      <h1 className="text-lg font-semibold">Access Denied</h1>
      <p>You do not have permission to view this page.</p>
    </div>
  );
}
