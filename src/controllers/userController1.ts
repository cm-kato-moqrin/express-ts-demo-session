import { Request, Response } from 'express';
import axios from 'axios';
import jwtDecode, { JwtPayload } from 'jwt-decode';

declare module 'express-session' {
  interface SessionData {
    views: number;
    userId: string;
    instanceId: string;
  }
}

// Display detail page for a specific User.
export async function user_controller(req: Request, res: Response) {
  // const instanceId = (
  //   await axios.get('http://169.254.169.254/latest/meta-data/instance-id')
  // ).data;
  const instanceId = 'dummy-instanceId';
  const token = req.header('x-amzn-oidc-data');
  if (!token) {
    res.send('token is undefined').status(200);
    return;
  }
  const userId = jwtDecode<JwtPayload>(token).sub;
  const session = req.session;
  if (!!session.views && session.userId === userId) {
    // セッションあり、ユーザー名が正しければ回数を増やす
    session.views++;
  } else if (!session.views) {
    // セッションなし -> セッション回数入力、ユーザー名を追加
    session.views = 1;
    session.userId = userId;
  } else {
    // セッション破棄
    session.destroy;
  }
  res.render('index', {
    userId: session.userId,
    views: session.views,
    instanceId: instanceId,
  });
}
