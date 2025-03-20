import '../styles/globals.css'
import { SessionProvider } from 'next-auth/react'
import Layout from '../components/Layout'
import { SidebarProvider } from '../components/SidebarContext'

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </SidebarProvider>
    </SessionProvider>
  )
}
