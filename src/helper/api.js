import { NextResponse } from "next/server";

function appJsonResponse(success, message, data, code) {
  return NextResponse.json({
    'success': success,
    'data': data,
    'message': message,
  }, {
    status: code
  });
}

function successJsonResponse(data, message = null, code = 200) {
  return appJsonResponse(true, message, data, code || 200);
}

function errorJsonResponse(message = null, code = 500, data) {
  return appJsonResponse(false, message, data, code || 500);
}

export const JsonResponse = {
  success: successJsonResponse,
  error: errorJsonResponse,
};
