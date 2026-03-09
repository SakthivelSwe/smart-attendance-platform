import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/core/network/dio_client.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    dio: ref.watch(dioClientProvider),
    secureStorage: ref.watch(secureStorageProvider),
  );
});

class AuthRepository {
  final Dio dio;
  final FlutterSecureStorage secureStorage;

  AuthRepository({required this.dio, required this.secureStorage});

  Future<bool> login(String email, String password) async {
    try {
      final response = await dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        // Verify response contains the token
        if (data != null && data['token'] != null) {
          final token = data['token'] as String;
          // Store token securely
          await secureStorage.write(key: 'auth_token', value: token);
          
          // Optionally store user info like name, role
          if (data['user'] != null) {
             final role = data['user']['role'];
             if(role != null) await secureStorage.write(key: 'user_role', value: role.toString());
          }
          return true;
        }
      }
      return false;
    } on DioException catch (e) {
      // Handle server error gracefully
      // Could refine this to return specific error messages
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<void> logout() async {
    await secureStorage.delete(key: 'auth_token');
    await secureStorage.delete(key: 'user_role');
  }

  Future<bool> isAuthenticated() async {
    final token = await secureStorage.read(key: 'auth_token');
    return token != null && token.isNotEmpty;
  }
}
