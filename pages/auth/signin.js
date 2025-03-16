import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'

export default function SignIn() {
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const formData = {
      email: e.target.email.value,
      password: e.target.password.value,
    }

    if (!isLogin) {
      // Register
      const name = e.target.name.value
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, name }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Something went wrong')
        }

        // After successful registration, log in
        const result = await signIn('credentials', {
          ...formData,
          redirect: false,
        })

        if (result.error) {
          throw new Error(result.error)
        }

        router.push('/dashboard')
      } catch (err) {
        setError(err.message)
        return
      }
    } else {
      // Login
      try {
        const result = await signIn('credentials', {
          ...formData,
          redirect: false,
        })

        if (result.error) {
          throw new Error(result.error)
        }

        router.push('/dashboard')
      } catch (err) {
        setError(err.message)
      }
    }
  }

  return (
    <div className="w-full h-full  flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white/70">
          {isLogin ? 'Login ' : 'Create a new account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className=" py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-white/70"
                >
                  Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm "
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-md font-medium text-white/70"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-md font-medium text-white/70"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm  sm:text-sm"
                />
              </div>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="w-full flex justify-center">
              <button
                type="submit"
                className="w-fit flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-md font-medium text-white bg-black/50"
              >
                {isLogin ? 'Sign in' : 'Register'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-center text-sm text-white/70 "
            >
              {isLogin
                ? 'Need an account? Register'
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
