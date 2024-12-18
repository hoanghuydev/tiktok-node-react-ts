import { PostModel } from '@/models/post';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import CommnentService, {
  CommentPayload,
  CommentsPayload,
} from './commentService';
import { PaginationModel } from '@/models';
import { message } from 'antd';
import { PostUploadModel } from '@/models/postUpload';
import AbstractPayload from '@/utils/abtractPayloadType';
import { CommentModel } from '@/models/comment';
import { RootState } from '@/redux/reducer';
import {
  handleFulfilled,
  handlePending,
  handleRejected,
} from '@/utils/handleSliceState';

// Async Thunks
export const getCommentsByPostId = createAsyncThunk(
  'post/getCommentsByPostId',
  async (postId: number, thunkAPI) => {
    try {
      const resp = await CommnentService.getCommentsByPostId(postId);
      return resp;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);
export const commentPost = createAsyncThunk(
  'post/commentPost',
  async (
    { postId, content }: { postId: number; content: string },
    { dispatch, getState, rejectWithValue } // Destructure getState from thunkAPI
  ) => {
    try {
      const resp = await CommnentService.commentPost(postId, content);
      resp.comment.commenterData = (getState() as RootState).auth.user!;
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const replyComment = createAsyncThunk(
  'post/replyComment',
  async (
    {
      postId,
      parentCommentId,
      content,
    }: { postId: number; parentCommentId: number; content: string },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const resp = await CommnentService.replyComment(
        postId,
        parentCommentId,
        content
      );
      resp.comment.commenterData = (getState() as RootState).auth.user!;
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  }
);

export interface InitStateCommentType {
  comments: CommentModel[];
  comment: CommentModel | null;
  isError: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  message: string;
}

// Initial state
const initialState: InitStateCommentType = {
  comments: [],
  comment: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Slice
const commentSlice = createSlice({
  name: 'comment',
  initialState,
  reducers: {
    setComment(state, action: { payload: CommentModel; type: string }) {
      state.comment = action.payload;
    },
    setComments(state, action: { payload: CommentModel[]; type: string }) {
      state.comments = action.payload;
    },
    resetResultStateCommentSlice(state) {
      state.isSuccess = false;
      state.isError = false;
    },
    setCommentsRepliesByCommentId(
      state,
      action: PayloadAction<{
        commentId: number;
        commentReplies: CommentModel[];
      }>
    ) {
      const { commentId, commentReplies } = action.payload;
      const comment = state.comments.find((c) => c.id === commentId);
      if (comment) {
        comment.commentReplies = commentReplies;
      }
    },
    setRepliesRemainingByCommentId(
      state,
      action: PayloadAction<{ commentId: number; repliesRemaining: number }>
    ) {
      const { commentId, repliesRemaining } = action.payload;
      const comment = state.comments.find((c) => c.id === commentId);
      if (comment) {
        comment.repliesRemaining = repliesRemaining;
      }
    },
    addComment(
      state,
      action: PayloadAction<{
        parentCommentId: number | null;
        comment: CommentModel;
      }>
    ) {
      const { parentCommentId, comment } = action.payload;
      if (parentCommentId) {
        const parentComment: CommentModel | undefined = state.comments.find(
          (c) => c.id === parentCommentId
        );
        if (parentComment) {
          parentComment.commentReplies = [
            comment,
            ...(parentComment.commentReplies || []),
          ]; // Thêm reply vào comment
          parentComment.replies += 1;
        }
      } else {
        state.comments.unshift(comment); // Thêm comment mới vào danh sách
      }
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(getCommentsByPostId.pending, handlePending)
      .addCase(getCommentsByPostId.fulfilled, (state, action) => {
        const payload = action.payload as CommentsPayload;
        state.comments = payload.comments;
        handleFulfilled(state, action);
      })
      .addCase(getCommentsByPostId.rejected, (state, action) => {
        const payload = action.payload as CommentsPayload;
        if (payload) {
          state.message = payload.mes;
          state.comments = [];
        }
        handleRejected(state, action);
      })
      .addCase(commentPost.pending, handlePending)
      .addCase(commentPost.fulfilled, (state, action) => {
        handleFulfilled(state, action);
        const payload = action.payload as CommentPayload;
        state.comments.unshift(payload.comment);
        message.success('Commented');
      })
      .addCase(commentPost.rejected, handleRejected)
      .addCase(replyComment.pending, handlePending)
      .addCase(replyComment.fulfilled, (state, action) => {
        handleFulfilled(state, action);
        const payload = action.payload as CommentPayload;
        state.comment = payload.comment;
        message.success('Commented');
      })
      .addCase(replyComment.rejected, handleRejected),
});

export const {
  addComment,
  setComment,
  setComments,
  setRepliesRemainingByCommentId,
  setCommentsRepliesByCommentId,
  resetResultStateCommentSlice,
} = commentSlice.actions;
export default commentSlice.reducer;
