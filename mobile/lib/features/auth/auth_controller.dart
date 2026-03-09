import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/auth/auth_repository.dart';

final authControllerProvider =
    AsyncNotifierProvider<AuthController, void>(AuthController.new);

class AuthController extends AsyncNotifier<void> {
  @override
  FutureOr<void> build() {
    // Initial state
  }

  Future<bool> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final authRepository = ref.read(authRepositoryProvider);
      final success = await authRepository.login(email, password);
      state = const AsyncValue.data(null);
      return success;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    try {
      final authRepository = ref.read(authRepositoryProvider);
      await authRepository.logout();
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
