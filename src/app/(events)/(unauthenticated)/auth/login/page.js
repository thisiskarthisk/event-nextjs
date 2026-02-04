'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import TextField from "@/components/form/TextField";

import { APP_NAME } from "@/constants";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { setPageTitle, toggleProgressBar, toast } = useAppLayoutContext();

  const [ formData, setFormData ] = useState({
    email: '',
    password: '',
  });

  const onFieldChanged = (e, fieldName) => {
    setFormData(prevData => {
      return {
        ...prevData,
        [fieldName]: e || '',
      };
    });
  };

  const onLoginFormSubmitted = async (e) => {
    e.preventDefault();

    try {
      if (document.activeElement) document.activeElement.blur();

      toggleProgressBar(true);

      const result = await signIn('credentials', {
        'redirect': false,
        ...formData,
        callbackUrl: '/',
      });

      console.log('login result:', result);

      if (result && result.ok && result.status == 200) {
        toast('success', 'Login Success.');
      } else {
        toast('error', 'Login failed! Please check your credentials and try again.');
      }
    } catch(error) {
      console.log('[onLoginFormSubmitted] Error occurred:', error);

      toast('error', 'Error occurred when trying to validate your credentials!');
    } finally {
      toggleProgressBar(false);
    }
  };

  useEffect(() => {
    setPageTitle('Login');

    toggleProgressBar(false);
  }, []);

  return (
    <>
      <div className="login-box">
        <div className="login-logo">
          <a href="">
            <img src="/assets/img/logo1.png" alt="App Logo"  height={"auto"} width={"60%"} className="mb-1" />
          </a>
        </div>
        <form action="" method="POST" onSubmit={onLoginFormSubmitted}>
          <TextField
            type="email"
            name="email"
            placeholder="Email"
            autoFocus
            onChange={e => onFieldChanged(e, 'email')}
            prefixIcon="email" />

          <TextField
            className="mt-3"
            name="password"
            type="password"
            placeholder="Password"
            autoFocus
            onChange={e => onFieldChanged(e, 'password')}
            prefixIcon="lock" />

           <div className="row mt-4">
            <div className="col-12">
              <button type="submit" className="btn btn-primary w-100">
                Login
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
