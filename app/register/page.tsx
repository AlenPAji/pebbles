import Link from "next/link";
import { Field, SimpleForm } from "../components/store";
export default function RegisterPage() { return <SimpleForm title={<>Make room for <em>good things.</em></>} button="Create account" note="Already have an account?"><Field label="Full name" /><Field label="Email address" type="email" /><Field label="Password" type="password" /><Link className="form-link" href="/login">Sign in instead →</Link></SimpleForm>; }
