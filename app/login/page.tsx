import Link from "next/link";
import { Field, SimpleForm } from "../components/store";
export default function LoginPage() { return <SimpleForm title={<>Welcome <em>back.</em></>} button="Sign in" note="New to Pebbles?"><Field label="Email address" type="email" /><Field label="Password" type="password" /><Link className="form-link" href="/register">Create an account →</Link></SimpleForm>; }
