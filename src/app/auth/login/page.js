'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import UnAuthenticatedPage from "@/components/auth/unAuthPagewrapper";
import TextField from "@/components/form/TextField";
import AppIcon from "@/components/icon";

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
        // [fieldName]: e.target.value || '',
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
    <UnAuthenticatedPage>
      <div className="login-box">
        <div className="login-logo">
          <a href="">
            <b>{APP_NAME}</b>
          </a>
        </div>

        <div className="card">
          <div className="card-body login-card-body">
            <p className="login-box-msg">Please login to proceed</p>

            <form action="" method="POST" onSubmit={onLoginFormSubmitted}>
              <TextField
                type="email"
                name="email"
                placeholder="Email"
                autoFocus
                onChange={e => onFieldChanged(e, 'email')}
                prefixIcon="email" />

              <TextField
                className="mb-3"
                name="password"
                type="password"
                placeholder="Password"
                autoFocus
                onChange={e => onFieldChanged(e, 'password')}
                prefixIcon="lock" />

              <div className="row">
                <div className="col-12 text-center">
                  <button type="submit" className="btn btn-primary">Login</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </UnAuthenticatedPage>
  );
}
