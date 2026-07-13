import { redirect } from 'next/navigation';

export default function RootPage() {
  // This immediately navigates the user to your home directory
  redirect('/site/home');
}