import { Outlet } from 'react-router-dom'
import Header from '../Header'
import Footer from '../Footer'

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container flex-grow py-4 md:py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout