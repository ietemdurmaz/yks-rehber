import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { loginAction } from "../actions";

export default async function LoginPage() {
  if (await getAdminUser()) redirect("/yonetim");
  return (
    <div className="container login">
      <div className="section">
        <h1>Yönetim Paneli Girişi</h1>
        <ActionForm action={loginAction} submitLabel="Giriş yap">
          <label>
            E-posta adresi
            <input type="email" name="email" autoComplete="username" required maxLength={254} />
          </label>
          <label>
            Parola
            <input type="password" name="password" autoComplete="current-password" required maxLength={200} />
          </label>
        </ActionForm>
      </div>
    </div>
  );
}
