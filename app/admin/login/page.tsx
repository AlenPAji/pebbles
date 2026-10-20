import { Field, SimpleForm } from "../../components/store";
export default function AdminLoginPage() { return <SimpleForm title={<>Your studio,<br /><em>at a glance.</em></>} button="Enter dashboard" note="Vendor access only"><Field label="Email address" type="email" /><Field label="Password" type="password" /></SimpleForm>; }
