import { NextResponse } from "next/server";

function appJsonResponse({success, message, data, code, errors}) {
  let jsonData = {
    success,
    message,
  };

  if (success) {
    jsonData.data = data;
  } else if (errors) {
    jsonData.errors = errors;
  }

  return NextResponse.json(jsonData, {
    status: code
  });
}

function successJsonResponse(data, message = null, code = 200) {
  return appJsonResponse({
    success: true,
    message,
    data,
    code: (code || 200),
  });
}

function errorJsonResponse(message = null, code = 500, errors = null) {
  return appJsonResponse({
    success: false,
    message,
    errors,
    code: (code || 500)
  });
}

export const JsonResponse = {
  success: successJsonResponse,
  error: errorJsonResponse,
};
