'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import UnAuthenticatedPage from "@/components/auth/unAuthPagewrapper";
import AppIcon from "@/components/icon";

import { APP_NAME } from "@/constants";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { setPageType, setPageTitle, toggleProgressBar, toast } = useAppLayoutContext();

  const [ isPasswordVisible, togglePasswordField ] = useState(false);

  const [ formData, setFormData ] = useState({
    email: '',
    password: '',
  });

  const onFieldChanged = (e, fieldName) => {
    setFormData(prevData => {
      return {
        ...prevData,
        [fieldName]: e.target.value || '',
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
    setPageType('auth');

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
              <div className="input-group mb-3">
                <div className="input-group-text">
                  <AppIcon ic="email" />
                </div>
                <input type="email" name="email" className="form-control" placeholder="Email" autoFocus onChange={e => onFieldChanged(e, 'email')} />
              </div>

              <div className="input-group mb-3">
                <div className="input-group-text">
                  <AppIcon ic="lock" />
                </div>
                <input type={isPasswordVisible ? "text" : "password"} name="password" className="form-control" placeholder="Password" onChange={e => onFieldChanged(e, 'password')} />
                <a href="#" className="btn btn-outline-secondary" onClick={e => {
                  e.preventDefault();

                  if(document.activeElement) document.activeElement.blur();

                  togglePasswordField(!isPasswordVisible);
                }}>
                  <AppIcon ic={isPasswordVisible ? "eye-off" : "eye"} />
                </a>
              </div>

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
