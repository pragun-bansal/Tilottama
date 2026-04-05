
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchCartData = createAsyncThunk(
    'cart/fetchCartData',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

            if (!token) {
                return rejectWithValue('No authentication token found');
            }

            console.log('🛒 Fetching cart data with token:', !!token);
            const response = await axios.post('/api/cart', { token });
            console.log('🛒 Cart fetch response:', response.data);

            return response.data.data.cart;
        } catch (error) {
            console.error('🛒 Cart fetch error:', error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
        }
    }
);

export const addToCart = createAsyncThunk(
    'cart/addToCart',
    async ({ productId, qty }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

            if (!token) {
                return rejectWithValue('No authentication token found');
            }

            console.log('🛒 Adding to cart:', { productId, qty });
            const response = await axios.post('/api/cart/add', { productId, qty, token });
            console.log('🛒 Add to cart response:', response.data);

            // Refetch cart data to get updated cart with populated product data
            dispatch(fetchCartData());

            return response.data.data;
        } catch (error) {
            console.error('🛒 Add to cart error:', error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
        }
    }
);

export const removeFromCart = createAsyncThunk(
    'cart/removeFromCart',
    async (productId, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

            if (!token) {
                return rejectWithValue('No authentication token found');
            }

            console.log('🛒 Removing from cart:', productId);
            const response = await axios.post('/api/cart/delete', { productId, token });
            console.log('🛒 Remove from cart response:', response.data);

            // Refetch cart data to get updated cart
            dispatch(fetchCartData());

            return response.data.data;
        } catch (error) {
            console.error('🛒 Remove from cart error:', error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Failed to remove from cart');
        }
    }
);

export const updateCartItemQuantity = createAsyncThunk(
    'cart/updateCartItemQuantity',
    async ({ productId, qty }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

            if (!token) {
                return rejectWithValue('No authentication token found');
            }

            console.log('🛒 Updating cart item quantity:', { productId, qty });
            const response = await axios.post('/api/cart/add', { productId, qty, token });
            console.log('🛒 Update quantity response:', response.data);

            // Refetch cart data to get updated cart
            dispatch(fetchCartData());

            return response.data.data;
        } catch (error) {
            console.error('🛒 Update quantity error:', error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Failed to update quantity');
        }
    }
);

const initialState = {
    items: [],
    totalCost: 0,
    totalItems: 0,
    _id: null,
    status: 'idle', // idle, loading, succeeded, failed
    loading: false,
    error: null,
    changed: false,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        replaceCart: (state, action) => {
            const cart_res = action.payload;
            console.log('🛒 Replacing cart with:', cart_res);

            if (cart_res && cart_res.items) {
                const cartTotal = cart_res.items.reduce((total, item) =>
                    total + (item.qty * (item.productId?.price || 0)), 0);
                const totalItems = cart_res.items.reduce((total, item) => total + item.qty, 0);

                state.totalCost = cartTotal;
                state.totalItems = totalItems;
                state._id = cart_res._id;
                state.items = cart_res.items;
                state.changed = true;
            } else {
                // Empty cart
                state.items = [];
                state.totalCost = 0;
                state.totalItems = 0;
                state._id = cart_res?._id || null;
            }

            state.loading = false;
            state.status = 'succeeded';
        },
        addItemToCart: (state, action) => {
            const newItem = action.payload;
            if (!state.items) state.items = [];

            const existingItemIndex = state.items.findIndex(
                (item) => item.productId?._id === newItem.productId?._id
            );

            if (existingItemIndex >= 0) {
                state.items[existingItemIndex].qty = newItem.qty;
            } else {
                state.items.push(newItem);
            }

            // Recalculate totals
            state.totalCost = state.items.reduce((total, item) =>
                total + (item.qty * (item.productId?.price || 0)), 0);
            state.totalItems = state.items.reduce((total, item) => total + item.qty, 0);
            state.changed = true;
        },
        increaseItemQuantity: (state, action) => {
            const { productId } = action.payload;
            const existingItem = state.items.find(
                (item) => item.productId?._id === productId
            );

            if (existingItem) {
                existingItem.qty += 1;
                // Recalculate totals
                state.totalCost = state.items.reduce((total, item) =>
                    total + (item.qty * (item.productId?.price || 0)), 0);
                state.totalItems = state.items.reduce((total, item) => total + item.qty, 0);
                state.changed = true;
            }
        },
        decreaseItemQuantity: (state, action) => {
            const { productId } = action.payload;
            const existingItem = state.items.find(
                (item) => item.productId?._id === productId
            );

            if (existingItem && existingItem.qty > 1) {
                existingItem.qty -= 1;
                // Recalculate totals
                state.totalCost = state.items.reduce((total, item) =>
                    total + (item.qty * (item.productId?.price || 0)), 0);
                state.totalItems = state.items.reduce((total, item) => total + item.qty, 0);
                state.changed = true;
            }
        },
        removeItemCompletelyFromCart: (state, action) => {
            const { productId } = action.payload;
            state.items = state.items.filter(
                (item) => item.productId?._id !== productId
            );

            // Recalculate totals
            if (state.items.length === 0) {
                state.totalCost = 0;
                state.totalItems = 0;
            } else {
                state.totalCost = state.items.reduce((total, item) =>
                    total + (item.qty * (item.productId?.price || 0)), 0);
                state.totalItems = state.items.reduce((total, item) => total + item.qty, 0);
            }
            state.changed = true;
        },
        clearCart: (state) => {
            state.items = [];
            state.totalCost = 0;
            state.totalItems = 0;
            state._id = null;
            state.changed = true;
        },
        clearError: (state) => {
            state.error = null;
        },
        resetChanged: (state) => {
            state.changed = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch cart data
            .addCase(fetchCartData.pending, (state) => {
                state.loading = true;
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchCartData.fulfilled, (state, action) => {
                const cart = action.payload;
                console.log('🛒 Cart data fetched successfully:', cart);

                if (cart && cart.items) {
                    state.items = cart.items;
                    state._id = cart._id;
                    state.totalCost = cart.items.reduce((total, item) =>
                        total + (item.qty * (item.productId?.price || 0)), 0);
                    state.totalItems = cart.items.reduce((total, item) => total + item.qty, 0);
                } else {
                    // Empty cart
                    state.items = [];
                    state.totalCost = 0;
                    state.totalItems = 0;
                    state._id = cart?._id || null;
                }

                state.loading = false;
                state.status = 'succeeded';
                state.changed = true;
                state.error = null;
            })
            .addCase(fetchCartData.rejected, (state, action) => {
                state.loading = false;
                state.status = 'failed';
                state.error = action.payload;
                console.error('🛒 Cart fetch failed:', action.payload);
            })
            // Add to cart
            .addCase(addToCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addToCart.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                // Note: fetchCartData will be called automatically to refresh data
            })
            .addCase(addToCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Remove from cart
            .addCase(removeFromCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeFromCart.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                // Note: fetchCartData will be called automatically to refresh data
            })
            .addCase(removeFromCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update cart item quantity
            .addCase(updateCartItemQuantity.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                // Note: fetchCartData will be called automatically to refresh data
            })
            .addCase(updateCartItemQuantity.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    replaceCart,
    addItemToCart,
    increaseItemQuantity,
    decreaseItemQuantity,
    removeItemCompletelyFromCart,
    clearCart,
    clearError,
    resetChanged,
} = cartSlice.actions;

export default cartSlice.reducer;