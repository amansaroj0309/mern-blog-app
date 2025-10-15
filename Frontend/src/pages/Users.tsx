import { useEffect, useState } from 'react';
import { Axios } from '../config/api';
import { handleAxiosError } from '../utils/utils';
import UserCard from '../components/UserCard';

interface User {
    _id: string;
    fullName: string;
    userName: string;
    profilePicture: string;
    followers: string[];
    following: string[];
}

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await Axios.get('/user/getusers');
                setUsers(data.data.users);
            } catch (error) {
                const err = await handleAxiosError(error);
                console.log('Error fetching users:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-3">
                <h1 className="text-3xl font-semibold text-center my-7">Users</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                            <div className="bg-gray-300 rounded-lg h-64"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-3">
            <h1 className="text-3xl font-semibold text-center my-7">Users</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                    <UserCard key={user._id} userId={user._id} />
                ))}
            </div>
        </div>
    );
};

export default Users;
